package com.project.waste;

import com.project.waste.enums.UserRole;
import com.project.waste.model.Enterprise;
import com.project.waste.model.User;
import com.project.waste.repository.EnterpriseRepository;
import com.project.waste.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class WasteApplication {
    public static void main(String[] args) {
        SpringApplication.run(WasteApplication.class, args);
    }

    @Bean
    public CommandLineRunner dataLoader(UserRepository userRepo, EnterpriseRepository enterpriseRepo) {
        return args -> {
            
            userRepo.findByEmail("khang7@gmail.com").ifPresent(user -> {
                if (user.getRole() == UserRole.ENTERPRISE && enterpriseRepo.findByOwnerId(user.getId()).isEmpty()) {
                    enterpriseRepo.save(Enterprise.builder()
                            .owner(user)
                            .companyName(user.getFullName() + " Enterprise")
                            .acceptedWasteTypes("ORGANIC,RECYCLABLE,HAZARDOUS,GENERAL,ELECTRONIC")
                            .address(user.getCity() != null ? user.getCity() : "TP.HCM")
                            .verified(true)
                            .build());
                }
            });
        };
    }
}