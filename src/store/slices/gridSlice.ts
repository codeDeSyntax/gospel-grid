import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GridTile {
  id: string;
  windowId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
}

interface GridPreset {
  id: string;
  name: string;
  description: string;
  tiles: Omit<GridTile, "windowId" | "isSelected">[];
  gridSize: {
    columns: number;
    rows: number;
  };
}

interface GridState {
  tiles: GridTile[];
  gridSize: {
    columns: number;
    rows: number;
  };
  presets: GridPreset[];
  activePresetId: string | null;
  isEditMode: boolean;
  snapToGrid: boolean;
  showGrid: boolean;
}

const initialState: GridState = {
  tiles: [],
  gridSize: { columns: 4, rows: 3 },
  presets: [
    {
      id: "preset-1",
      name: "Church Service",
      description: "Perfect layout for church streaming",
      gridSize: { columns: 4, rows: 3 },
      tiles: [
        { id: "tile-1", x: 0, y: 0, width: 2, height: 2 },
        { id: "tile-2", x: 2, y: 0, width: 2, height: 1 },
        { id: "tile-3", x: 2, y: 1, width: 2, height: 1 },
        { id: "tile-4", x: 0, y: 2, width: 4, height: 1 },
      ],
    },
    {
      id: "preset-2",
      name: "Split View",
      description: "Simple two-window layout",
      gridSize: { columns: 2, rows: 1 },
      tiles: [
        { id: "tile-1", x: 0, y: 0, width: 1, height: 1 },
        { id: "tile-2", x: 1, y: 0, width: 1, height: 1 },
      ],
    },
  ],
  activePresetId: null,
  isEditMode: false,
  snapToGrid: true,
  showGrid: true,
};

const gridSlice = createSlice({
  name: "grid",
  initialState,
  reducers: {
    addTile: (
      state,
      action: PayloadAction<Omit<GridTile, "id" | "isSelected">>
    ) => {
      const newTile: GridTile = {
        ...action.payload,
        id: `tile-${Date.now()}`,
        isSelected: false,
      };
      state.tiles.push(newTile);
    },
    removeTile: (state, action: PayloadAction<string>) => {
      state.tiles = state.tiles.filter((tile) => tile.id !== action.payload);
    },
    updateTile: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<GridTile> }>
    ) => {
      const tile = state.tiles.find((t) => t.id === action.payload.id);
      if (tile) {
        Object.assign(tile, action.payload.updates);
      }
    },
    selectTile: (state, action: PayloadAction<string>) => {
      state.tiles.forEach((tile) => {
        tile.isSelected = tile.id === action.payload;
      });
    },
    clearSelection: (state) => {
      state.tiles.forEach((tile) => {
        tile.isSelected = false;
      });
    },
    setGridSize: (
      state,
      action: PayloadAction<{ columns: number; rows: number }>
    ) => {
      state.gridSize = action.payload;
    },
    loadPreset: (state, action: PayloadAction<string>) => {
      const preset = state.presets.find((p) => p.id === action.payload);
      if (preset) {
        state.activePresetId = preset.id;
        state.gridSize = preset.gridSize;
        state.tiles = preset.tiles.map((tile, index) => ({
          ...tile,
          id: `tile-${Date.now()}-${index}`,
          windowId: null,
          isSelected: false,
        }));
      }
    },
    savePreset: (
      state,
      action: PayloadAction<{ name: string; description: string }>
    ) => {
      const newPreset: GridPreset = {
        id: `preset-${Date.now()}`,
        name: action.payload.name,
        description: action.payload.description,
        gridSize: state.gridSize,
        tiles: state.tiles.map(({ windowId, isSelected, ...tile }) => tile),
      };
      state.presets.push(newPreset);
    },
    deletePreset: (state, action: PayloadAction<string>) => {
      state.presets = state.presets.filter((p) => p.id !== action.payload);
      if (state.activePresetId === action.payload) {
        state.activePresetId = null;
      }
    },
    setEditMode: (state, action: PayloadAction<boolean>) => {
      state.isEditMode = action.payload;
      if (!action.payload) {
        state.tiles.forEach((tile) => {
          tile.isSelected = false;
        });
      }
    },
    setSnapToGrid: (state, action: PayloadAction<boolean>) => {
      state.snapToGrid = action.payload;
    },
    setShowGrid: (state, action: PayloadAction<boolean>) => {
      state.showGrid = action.payload;
    },
    assignWindowToTile: (
      state,
      action: PayloadAction<{ tileId: string; windowId: string }>
    ) => {
      const tile = state.tiles.find((t) => t.id === action.payload.tileId);
      if (tile) {
        tile.windowId = action.payload.windowId;
      }
    },
    removeWindowFromTile: (state, action: PayloadAction<string>) => {
      const tile = state.tiles.find((t) => t.id === action.payload);
      if (tile) {
        tile.windowId = null;
      }
    },
  },
});

export const {
  addTile,
  removeTile,
  updateTile,
  selectTile,
  clearSelection,
  setGridSize,
  loadPreset,
  savePreset,
  deletePreset,
  setEditMode,
  setSnapToGrid,
  setShowGrid,
  assignWindowToTile,
  removeWindowFromTile,
} = gridSlice.actions;

export default gridSlice.reducer;
