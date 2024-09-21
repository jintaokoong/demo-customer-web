import { twm } from "../lib/twm";

type ButtonProps = JSX.IntrinsicElements["button"];

const Button = ({ children, ...p }: ButtonProps) => {
  return (
    <button
      {...p}
      className={twm(
        "border-2 border-gray-500 bg-gray-200 px-2 text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-default",
        p.className,
      )}
    >
      {children}
    </button>
  );
};

export default Button;
