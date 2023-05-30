/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { Select, Option } from "@kth/style";

interface SelectionStepProps {
  onSubmit: () => void;
}

export default function SelectionStep({ onSubmit }: SelectionStepProps) {
  return (
    <form onSubmit={onSubmit}>
      <h1>Select assignment and date</h1>
      <p>
        In this step you map a Canvas assignment to a Ladok module or
        examination.
      </p>
      <Select
        name="canvas-assignment"
        value="1"
        onChange={() => {}}
        label="Select assignment"
        description="Only letter grades will be transferred to Ladok: A-F grades or P/F"
      >
        <Option value="1">Assignment 1</Option>
      </Select>
      <Select
        name="ladok-module"
        value="1"
        onChange={() => {}}
        label="Ladok module"
        description="To which module do you want the grades to be transferred"
      >
        <Option value="1">Assignment 1</Option>
      </Select>
      <h2>Examination date</h2>
      <p>
        All affected grades will receive the same Examination Date. To set a
        different date on an individual level, change it in Ladok after
        transferring.
      </p>
      <button>Continue</button> (Nothing is transferred yet)
    </form>
  );
}
