import React from "react";
import Quote from "../components/Quote";

const Signup = () => {
  return (
    <div className="grid grid-cols-2">
      <div></div>
      <div className="invisible lg:visible">
        <Quote />
      </div>
    </div>
  );
};

export default Signup;
