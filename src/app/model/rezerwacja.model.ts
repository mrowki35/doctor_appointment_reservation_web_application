export class Rezerwacja {
  data: Date; 
  start: string; 
  koniec: string; 
  lekarzId: string; 
  paid: boolean;
  id: string;
  pacjentId: string;
  informacje: string;
  typ_konsultacji: string;
  done: boolean;
  cancelled: boolean;

  constructor(
    data: Date,
    start: string,
    koniec: string,
    lekarzId: string,
    id: string,
    pacjentId: string,
    typ_konsultacji: string,
    informacje: string,
    paid: boolean,
    done: boolean,
    cancelled: boolean
  ) {
    this.data = data;
    this.start = start;
    this.koniec = koniec;
    this.lekarzId = lekarzId;
    this.id = id;
    this.informacje = informacje;
    this.pacjentId = pacjentId;
    this.typ_konsultacji = typ_konsultacji;
    this.paid = paid;
    this.done = done;
    this.cancelled = cancelled;
  }
}
