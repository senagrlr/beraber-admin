import { createTheme } from "@mui/material/styles";
import { COLORS } from "./constants/colors";

export const theme = createTheme({
  typography: {
    fontFamily: `'Quicksand', sans-serif`,
  },
  palette: {
    primary: { main: COLORS.mainRed },
    background: { default: COLORS.lightBg },
    text: { primary: COLORS.textColor },
  },
});
