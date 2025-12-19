export type History = {
    Id: number;
    UserId: number;
    Year: number;
    Rank: number;
    Points?: number;
    User?: {
        Id: number;
        FirstName: string;
        LastName: string;
        Username: string;
        Password: string;
        Email: string;
        isCom: boolean | null;
        Inactive: boolean | undefined;
    },
    Preferences?: {
        Id: number;
        UserId: number;
        Color ?: string;
        Image ?: string;
    }
};
