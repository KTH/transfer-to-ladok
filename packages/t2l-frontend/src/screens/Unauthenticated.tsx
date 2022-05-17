import React from "react";

interface Params {
  courseId: string;
}

/** Screen shown when the user is not logged in */
export default function Unauthenticated({ courseId }: Params) {
  return (
    <div>
      <h1>Welcome to Transfer to Ladok</h1>
      <p>Lorem ipsum todo todo</p>
      <a href={`/transfer-to-ladok/auth?courseId=${courseId}`}>Go!</a>
    </div>
  );
}
