// app.jsx wrapped with authcontext

import React from "react";
import AppRouter from "./config/Router";

import { UseAppContextProvider } from "./context/AppContext";
import { SurveyProvider } from "./context/SurveyContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const App = () => {
  return (
    <UseAppContextProvider>
      <SurveyProvider>
        <AppRouter />
        <ToastContainer />
      </SurveyProvider>
    </UseAppContextProvider>
  );
};

export default App;
