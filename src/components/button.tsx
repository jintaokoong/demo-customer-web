type ButtonProps = JSX.IntrinsicElements["button"];

const Button = ({ children, ...p }: ButtonProps) => {
  return (
    <button
      className="border-2 border-gray-500 bg-gray-200 px-2 text-sm hover:bg-gray-300"
      {...p}
    >
      {children}
    </button>
  );
};

export default Button;
