import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  loadFeatureCaptionsState,
  normalizeFeatureCaptionsState,
  type FeatureCaptionsState,
} from "@/components/dashboard/RightPanel/features/captions/featureCaptionsState";

interface CaptionsSliceState {
  state: FeatureCaptionsState;
}

const initialState: CaptionsSliceState = {
  state: loadFeatureCaptionsState(),
};

const captionsSlice = createSlice({
  name: "captions",
  initialState,
  reducers: {
    setCaptionsState: (
      current,
      action: PayloadAction<
        Partial<FeatureCaptionsState> | FeatureCaptionsState
      >,
    ) => {
      current.state = normalizeFeatureCaptionsState({
        ...current.state,
        ...action.payload,
      });
    },
    replaceCaptionsState: (
      current,
      action: PayloadAction<FeatureCaptionsState>,
    ) => {
      current.state = normalizeFeatureCaptionsState(action.payload);
    },
  },
});

export const { setCaptionsState, replaceCaptionsState } = captionsSlice.actions;
export default captionsSlice.reducer;
