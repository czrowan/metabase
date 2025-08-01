// eslint-disable-next-line no-restricted-imports
import styled from "@emotion/styled";

import { animationStyles } from "metabase/visualizations/components/skeletons/ChartSkeleton/ChartSkeleton.styled";

export const SkeletonImage = styled.svg`
  ${animationStyles};
  flex: 1 1 0;
  margin: 1rem;
`;
