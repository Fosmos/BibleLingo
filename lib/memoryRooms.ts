export interface RoomFurniturePiece {
  key: string;
  label: string;
}

export interface Room {
  key: string;
  name: string;
  furniture: RoomFurniturePiece[];
}
