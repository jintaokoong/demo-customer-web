import { twm } from "../lib/twm";

type TextInputProps = JSX.IntrinsicElements["input"] & {
  /**
   * class names for overriding styles
   */
  classes?: {
    container?: string;
    label?: string;
    input?: string;
    error?: string;
  };
  label?: string;
};

const TextInput = ({ classes, label, ...p }: TextInputProps) => {
  return (
    <div className={classes?.container}>
      <label
        className={twm(
          "block font-semibold text-xs mb-1 max-w-fit",
          classes?.label,
        )}
        htmlFor={p.id}
      >
        {label}
      </label>
      <input
        name={p.id}
        className={twm(
          "border-gray-300 border py-1 px-2 focus:outline-none focus:ring focus:ring-blue-400",
          classes?.input,
        )}
        {...p}
      />
    </div>
  );
};

export default TextInput;
