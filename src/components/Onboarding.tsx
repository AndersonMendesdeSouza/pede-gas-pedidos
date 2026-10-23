import { useState } from "react";
import { readStorage, writeStorage } from "../services/storage";
import { useApp } from "../contexts/AppContext";
import { errorMessage } from "../utils/order";
import { Modal } from "./ui";
import Icon from "./Icon";
import store from "../assets/app/carousel/img2.png";
import products from "../assets/app/carousel/img3.png";
import delivery from "../assets/app/order/moto.png";

const slides = [
  {
    title: "Bem-vindo ao Pede Gás",
    text: "Seu gás e água mineral direto da distribuidora de Buriti Alegre para o seu lar.",
    image: store,
  },
  {
    title: "Gás e água em um só lugar",
    text: "Peça seu botijão ou água mineral com poucos cliques, sem precisar ligar ou sair de casa.",
    image: products,
  },
  {
    title: "Praticidade até a sua porta",
    text: "Escolha seus produtos, acompanhe seu pedido e pague na entrega.",
    image: delivery,
  },
];
export default function Onboarding() {
  const [open, setOpen] = useState(
    () => !readStorage("pedegas:onboarding", false),
  );
  const [step, setStep] = useState(0);
  const { notify } = useApp();
  function finish() {
    try {
      writeStorage("pedegas:onboarding", true);
    } catch (error) {
      notify(errorMessage(error));
    }
    setOpen(false);
  }
  if (!open) return null;
  const slide = slides[step];
  return (
    <Modal title={slide.title} onClose={finish}>
      <div className="onboarding">
        <img src={slide.image} alt="Pede Gás e água mineral" />
        <p className="muted">{slide.text}</p>
        <div className="onboarding-dots" aria-label={`Passo ${step + 1} de 3`}>
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              className={index === step ? "active" : ""}
              onClick={() => setStep(index)}
              aria-label={`Ver passo ${index + 1}`}
            />
          ))}
        </div>
        <button
          className="button full"
          onClick={() =>
            step < slides.length - 1 ? setStep(step + 1) : finish()
          }
        >
          {step < slides.length - 1 ? "Continuar" : "Começar meu pedido"}
          <Icon name="arrow" size={17} />
        </button>
        <button className="text-button" onClick={finish}>
          Pular apresentação
        </button>
      </div>
    </Modal>
  );
}
