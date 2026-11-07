import { Redirect } from 'expo-router';

// Pantalla de la antigua tienda Vokter: ya no existe en Fanáticos 360.
// Este archivo se puede borrar (git rm); mientras exista, solo lleva al inicio.
export default function PantallaRetirada() {
  return <Redirect href="/" />;
}
