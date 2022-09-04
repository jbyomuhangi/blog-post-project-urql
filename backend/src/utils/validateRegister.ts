import { RegisterInput, FieldError } from "../resolvers/UserResolver";

const validateRegister = ({
  email,
  username,
  password,
}: RegisterInput): FieldError[] => {
  const errors: FieldError[] = [];

  if (!email.includes("@")) {
    errors.push({ field: "email", message: "invalid email" });
  }

  if (username.length < 3) {
    errors.push({
      field: "username",
      message: "username must be at least 3 chars",
    });
  }

  if (username.includes("@")) {
    errors.push({ field: "username", message: `username can not include "@"` });
  }

  if (password.length < 3) {
    errors.push({
      field: "password",
      message: "password must be at least 3 chars",
    });
  }

  return errors;
};

export default validateRegister;
