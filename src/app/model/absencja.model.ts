export class Absencja {
  lekarzId: string;
  data: Date;
  id?: string;

  constructor(lekarzId: string, data: Date, id?: string) {
    this.lekarzId = lekarzId;
    this.data = data;
    if (id) {
      this.id = id;
    }
  }
}
