import { createSelector, createSlice } from "@reduxjs/toolkit";
import { dispatchWithStore } from "../store/storeRef";

const initialState = {
    data: null,
};

export const authSlice = createSlice({
    name: "UserSignup",
    initialState,
    reducers: {

        updateDataSuccess: (usersignup, action) => {
            usersignup.data = action.payload;
        },
        userUpdateData: (usersignup, action) => {
            usersignup.data.data = action.payload.data;
        },
        userLogout: (usersignup) => {
            usersignup.data = null; // Clear data when user logs out
        }
    },
});

export const { updateDataSuccess, userUpdateData, userLogout } = authSlice.actions;
export default authSlice.reducer;

export const loadUpdateData = (data) => {
    dispatchWithStore(updateDataSuccess(data));
};
export const loadUpdateUserData = (data) => {
    dispatchWithStore(userUpdateData({ data }));
};
export const logoutSuccess = () => {
    dispatchWithStore(userLogout());
};


export const userSignUpData = createSelector(
    (state) => state.UserSignup,
    (UserSignup) => UserSignup?.data?.data
);

export const getIsLoggedIn = createSelector(
    (state) => state.UserSignup,
    (UserSignup) => UserSignup?.data?.token
);




