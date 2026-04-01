import { create } from "zustand";

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertOptions {
  cancelable?: boolean;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: undefined,
  buttons: undefined,
  options: undefined,
  showAlert: (title, message, buttons, options) =>
    set({ visible: true, title, message, buttons, options }),
  hideAlert: () => set({ visible: false }),
}));

export const CustomAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    useAlertStore.getState().showAlert(title, message, buttons, options);
  },
};
