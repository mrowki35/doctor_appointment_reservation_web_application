export class Pacjent {
  id: string;
  imie: string;
  nazwisko: string;
  wiek: number;
  sex: string;
  kontoId: string;

  constructor(
    imie: string,
    nazwisko: string,
    id: string,
    wiek: number,
    sex: string,
    kontoId: string
  ) {
    this.imie = imie;
    this.nazwisko = nazwisko;
    this.id = id;
    this.wiek = wiek;
    this.sex = sex;
    this.kontoId = kontoId;
  }
}
