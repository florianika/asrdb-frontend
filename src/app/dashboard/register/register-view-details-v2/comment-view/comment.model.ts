export interface Comments {
  notesDTO: {
    "noteId": number,
    "bldId": string,
    "noteText": string,
    "createdUser": string,
    "createdTimestamp": string,
    "updatedUser": string,
    "updatedTimestamp": string,
    "userId": string
  }[]
}

export interface CreateComment {
  bldId: string;
  noteText: string;
  createdUser: string;
  userId: string;
}
