import { z } from "zod";

const IsoDateSchema = z.string().datetime();

// accepts an ISO formatted date string and returns a formatted date string
export const formatDate = (date: Date): string | null => {
  // check date is invalid date
  if (isNaN(date.getTime())) {
    return null;
  }

  // format in dd-mm-yyyy
  return date.toLocaleDateString("en-GB");
};
