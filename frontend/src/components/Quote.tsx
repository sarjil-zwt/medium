import React from "react";

const Quote = () => {
  return (
    <div className="bg-slate-200 h-screen flex justify-center items-center flex-col">
      <div className="max-w-lg flex flex-col gap-1">
        <p className=" text-3xl font-bold">
          "The customer service I received was exceptional. The support team
          went above and beyond to address my concerns."
        </p>
        <p>Jules Winnfield</p>
        <p className="text-slate-400"> CEO, Acme Inc</p>
      </div>
    </div>
  );
};

export default Quote;
