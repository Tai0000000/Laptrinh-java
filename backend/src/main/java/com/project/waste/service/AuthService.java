package com.project.waste.service;

import com.project.waste.dto.*;
import com.project.waste.enums.UserRole;
import com.project.waste.model.User;
import com.project.waste.repository.UserRepository;
import com.project.waste.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.project.waste.repository.EnterpriseRepository enterpriseRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    public ResponseEntity<?> authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        User userDetails = (User) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new AuthResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles));
    }

    public ResponseEntity<?> registerUser(RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        
        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .passwordHash(encoder.encode(signUpRequest.getPassword()))
                .fullName(signUpRequest.getFullName() != null && !signUpRequest.getFullName().isBlank() ? signUpRequest.getFullName() : signUpRequest.getUsername())
                .phone(signUpRequest.getPhone())
                .city(signUpRequest.getCity())
                .active(true)
                .totalPoints(0)
                .build();

        String strRole = signUpRequest.getRole();
        UserRole role;

        if (strRole == null) {
            role = UserRole.CITIZEN;
        } else {
            switch (strRole.toLowerCase()) {
                case "admin":
                    role = UserRole.ADMIN;
                    break;
                case "enterprise":
                    role = UserRole.ENTERPRISE;
                    break;
                case "collector":
                    role = UserRole.COLLECTOR;
                    break;
                default:
                    role = UserRole.CITIZEN;
            }
        }

        user.setRole(role);
        User savedUser = userRepository.save(user);

        
        
        if (role == UserRole.ENTERPRISE) {
             com.project.waste.model.Enterprise ent = com.project.waste.model.Enterprise.builder()
                     .owner(savedUser)
                     .companyName(savedUser.getFullName() + " Enterprise")
                     .acceptedWasteTypes("ORGANIC,RECYCLABLE,HAZARDOUS,GENERAL,ELECTRONIC")
                     .address(savedUser.getCity() != null ? savedUser.getCity() : "TP.HCM")
                     .verified(true)
                     .build();
             enterpriseRepository.save(ent);
         }

        return ResponseEntity.status(201).body(new MessageResponse("User registered successfully!"));
    }
}
