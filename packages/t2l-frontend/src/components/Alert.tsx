import React from "react";
import "./Alert.scss";

interface AlertProps {
  children: React.ReactNode;
}

export function InfoAlert({ children }: AlertProps) {
  return <div className="alert-info">{children}</div>;
}

export function ErrorAlert({ children }: AlertProps) {
  return <div className="alert-error">{children}</div>;
}
