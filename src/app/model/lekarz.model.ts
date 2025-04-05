export class Lekarz {
  id: string;
  imie: string;
  nazwisko: string;
  specjalizacja: string;

  constructor(
    imie: string,
    nazwisko: string,
    id: string,
    specjalizacja: string
  ) {
    this.imie = imie;
    this.nazwisko = nazwisko;
    this.id = id;
    this.specjalizacja = specjalizacja;
  }
}
