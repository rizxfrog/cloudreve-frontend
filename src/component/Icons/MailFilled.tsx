import { SvgIcon, SvgIconProps } from "@mui/material";

// Filled counterpart to MailOutlined, used for the active navigation state.
export default function MailFilled(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5.25 4h13.5a3.25 3.25 0 0 1 3.25 3.25v9.5a3.25 3.25 0 0 1-3.25 3.25H5.25A3.25 3.25 0 0 1 2 16.75v-9.5A3.25 3.25 0 0 1 5.25 4m-.83 3.9a.75.75 0 0 0-.83 1.25l7.5 5a.75.75 0 0 0 .82 0l7.5-5a.75.75 0 0 0-.83-1.25L12 12.635z" />
    </SvgIcon>
  );
}
