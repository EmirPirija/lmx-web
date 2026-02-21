import { createSlice } from "@reduxjs/toolkit";
import { toast } from "@/utils/toastBs";

const initialState = {
  compareList: [], // Tu čuvamo cijele objekte oglasa
};

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    addToCompare: (state, action) => {
      const item = action.payload;
      
      // Limit na 4 oglasa
      if (state.compareList.length >= 4) {
        toast.error("Možete usporediti najviše 4 oglasa.");
        return;
      }

      // Provjera je li već dodan
      const exists = state.compareList.find((i) => i.id === item.id);
      if (exists) {
        toast.info("Oglas je već u usporedbi.");
        return;
      }

      // Provjera kategorije (opcionalno - ako želiš da uspoređuju samo iste kategorije)
      if (state.compareList.length > 0) {
        const firstCategory = state.compareList[0].category_id;
        if (item.category_id !== firstCategory) {
           toast.warning("Preporučujemo usporedbu oglasa iz iste kategorije.");
           // return; // Odkomentiraj ako želiš striktno zabraniti
        }
      }

      state.compareList.push(item);
      toast.success("Dodano za usporedbu!");
    },
    removeFromCompare: (state, action) => {
      const id = action.payload;
      state.compareList = state.compareList.filter((item) => item.id !== id);
    },
    clearCompare: (state) => {
      state.compareList = [];
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export const selectCompareList = (state) => state.Compare.compareList;
export default compareSlice.reducer;
