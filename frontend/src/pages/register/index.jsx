import { Link, useNavigate } from "react-router-dom";
import { Button, Input, notification } from "antd";
import React from "react";
import "./index.css";
import authApi from "../api/authApi";

export default function Register() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",
  });

  const [usernameError, setUsernameError] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [confirmPasswordError, setConfirmPasswordError] = React.useState("");

  const validateData = (name, value) => {
    // Tạo đối tượng chứa lỗi
    const errorsMessage = {
      username: "Tên không được để trống",
      email: {
        empty: "Email không được để trống",
        inValid: "Email không đúng định dạng",
      },
      password: "Mật khẩu không được để trống",
      confirmPassword: {
        empty: "Xác nhận mật khẩu không được để trống",
        noMatch: "Mật khẩu không trùng khớp",
      },
    };

    // Đối tượng chứa các hàm cập nhật lỗi
    const errorSetters = {
      username: setUsernameError,
      email: setEmailError,
      password: setPasswordError,
      confirmPassword: setConfirmPasswordError,
    };
    const errorSetter = errorSetters[name];

    // Check rỗng
    if (!value) {
      errorSetter(errorsMessage[name].empty || errorsMessage[name]);
      return false;
    }

    // Check email
    if (name === "email" && !validateEmail(value)) {
      errorSetter(errorsMessage.email.inValid);
      return false;
    }

    // Check confirm password
    if (name === "confirmPassword" && value !== user.password) {
      setConfirmPasswordError(errorsMessage.confirmPassword.noMatch);
      return false;
    }
    errorSetter("");
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setUser({ ...user, [name]: value });

    validateData(name, value);

    // Nếu đổi password, check lại confirmPassword
    if (name === "password" && user.confirmPassword) {
      validateData("confirmPassword", user.confirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isUsernameValid = validateData("username", user.username);
    const isEmailValid = validateData("email", user.email);
    const isPasswordValid = validateData("password", user.password);
    const isConfirmPasswordValid = validateData(
      "confirmPassword",
      user.confirmPassword,
    );

    if (
      isUsernameValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmPasswordValid
    ) {
      try {
        const { username, email, password } = user;
        await authApi.register({ username, email, password });

        notification.success({
          title: "Thành công",
          description: "Đăng ký tài khoản thành công",
        });

        // navigate("/login");
      } catch (error) {
        const statusCode = error?.response?.status;
        const errorMessage = error?.response?.data?.message || "Có lỗi xảy ra";
        if (statusCode === 400) {
          notification.error({
            title: "Cảnh báo",
            description: errorMessage,
          });
        } else {
          notification.error({
            title: "Lỗi",
            description: "Server đang gặp vấn đề",
          });
        }
      }
    }
  };

  return (
    <>
      <div className="flex justify-center items-center h-screen">
        <form
          onSubmit={handleSubmit}
          className="w-[400px] border px-6 py-5 rounded shadow-md flex flex-col gap-[12px]"
        >
          <h3 className="text-center text-[20px] font-semibold uppercase">
            Đăng ký tài khoản
          </h3>
          <div className="flex flex-col gap-2">
            <label htmlFor="">Username</label>
            <Input
              onChange={handleChange}
              name="username"
              status={usernameError ? "error" : ""}
            ></Input>
            {usernameError && (
              <span className="error-message">{usernameError}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="">Email</label>
            <Input
              onChange={handleChange}
              name="email"
              status={emailError ? "error" : ""}
            ></Input>
            {emailError && <span className="error-message">{emailError}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="">Password</label>
            <Input.Password
              onChange={handleChange}
              name="password"
              status={passwordError ? "error" : ""}
            ></Input.Password>
            {passwordError && (
              <span className="error-message">{passwordError}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label>Confirm Password</label>
            <Input.Password
              onChange={handleChange}
              name="confirmPassword"
              status={confirmPasswordError ? "error" : ""}
            />
            {confirmPasswordError && (
              <span className="error-message">{confirmPasswordError}</span>
            )}
          </div>
          <div>
            <Button htmlType="submit" className="w-full" type="primary">
              Đăng ký
            </Button>
          </div>
          <div className="text-center">
            <span>Bạn đã có tài khoản? </span>
            <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </form>
      </div>
    </>
  );
}
