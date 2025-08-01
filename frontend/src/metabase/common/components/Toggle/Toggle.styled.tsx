// eslint-disable-next-line no-restricted-imports
import styled from "@emotion/styled";

import { focusOutlineStyle } from "metabase/common/style/input";
import { color } from "metabase/lib/colors";

interface ToggleRootProps {
  checked?: boolean;
  small?: boolean;
  currentColor?: string;
}

const getTranslateX = ({ checked, small }: ToggleRootProps): string => {
  if (!checked) {
    return "1px";
  } else if (!small) {
    return "25px";
  } else {
    return "12px";
  }
};

const getBackgroundColor = ({
  checked,
  currentColor,
}: ToggleRootProps): string => {
  if (checked) {
    return currentColor ?? color("brand");
  } else {
    return "var(--mb-color-bg-medium)";
  }
};

export const ToggleRoot = styled.input<ToggleRootProps>`
  appearance: none;
  position: relative;
  display: inline-block;
  color: ${(props) => props.currentColor ?? color("brand")};
  cursor: pointer;
  width: ${(props) => (props.small ? "28px" : "48px")};
  height: ${(props) => (props.small ? "17px" : "24px")};
  border-radius: 99px;
  border: 1px solid var(--mb-color-border);
  background-color: ${getBackgroundColor};
  transition: background-color 0.3s;
  flex-shrink: 0;

  &[disabled] {
    cursor: not-allowed;
    opacity: 0.5;
    background-color: var(--mb-color-bg-medium);
  }

  &:after {
    content: "";
    width: ${(props) => (props.small ? "13px" : "20px")};
    height: ${(props) => (props.small ? "13px" : "20px")};
    border-radius: 99px;
    position: absolute;
    top: 1px;
    transform: translateX(${getTranslateX});
    background-color: var(--mb-color-bg-white);
    transition: transform 0.3s;
    box-shadow: 2px 2px 6px var(--mb-color-shadow);
  }

  ${focusOutlineStyle("brand")};
`;
