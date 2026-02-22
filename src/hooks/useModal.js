import { useState } from "react";

const useModal = (initialState = false) => {
  const [isOpened, setIsOpened] = useState(initialState);
  const toggleIsOpened = () => setIsOpened(!isOpened);
  const openModal = () => setIsOpened(true);
  const closeModal = () => setIsOpened(false);

  return { isOpened, toggleIsOpened, closeModal, openModal };
};
export default useModal;
