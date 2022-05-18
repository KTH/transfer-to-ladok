import React from "react";
import type { Sections } from "t2l-backend";

interface Props {
  sections: Sections;
}

export default function Authenticated({ sections }: Props) {
  return <div>Yay!</div>;
}
