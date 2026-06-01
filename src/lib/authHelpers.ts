import type { UserProfile, UserRole } from "../types";

export function getDashboardPathByRole(role: UserRole): string {
  if (role === "ADMIN") {
    return "/admin/dashboard";
  }

  if (role === "TUTOR") {
    return "/tutor/dashboard";
  }

  return "/student/dashboard";
}

export function getDefaultRole(value: string): UserRole {
  if (value === "TUTOR") {
    return "TUTOR";
  }

  if (value === "ADMIN") {
    return "ADMIN";
  }

  return "STUDENT";
}

export function getProfileDisplayName(profile: UserProfile | null): string {
  if (!profile) {
    return "Guest";
  }

  return profile.name?.trim() || profile.email || "User";
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isStrongEnoughPassword(password: string): boolean {
  return password.trim().length >= 6;
}

export function getPasswordValidationMessage(password: string): string {
  if (!password.trim()) {
    return "Password is required.";
  }

  if (!isStrongEnoughPassword(password)) {
    return "Password should be at least 6 characters.";
  }

  return "";
}

export function getEmailValidationMessage(email: string): string {
  if (!email.trim()) {
    return "Email is required.";
  }

  if (!isValidEmail(email)) {
    return "Please enter a valid email address.";
  }

  return "";
}

export function getNameValidationMessage(name: string): string {
  if (!name.trim()) {
    return "Name is required.";
  }

  if (name.trim().length < 2) {
    return "Name should be at least 2 characters.";
  }

  return "";
}