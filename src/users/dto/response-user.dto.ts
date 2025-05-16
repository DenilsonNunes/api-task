class ITask {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  createdAt: Date | null;
  userId: number | null;
}

export class ResponseFindOneUserDto {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  Task: ITask[];
}

export class ResponseCreateUserDto {
  id: number;
  name: string;
  email: string;
}

export class ResponseUpdateAvatarDto {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}
