// Типы данных
export type CommentData = {
    id: string;
    parentId: string | null;
    author: string;
    avatar: string;
    text: string;
    date: Date;
    rating: number;
    isFavorite: boolean;
    replies: CommentData[];
};

export type SortOption = 'date' | 'rating' | 'activity' | 'replies';
export type SortDirection = 'asc' | 'desc';

// Класс для работы с LocalStorage
export class StorageService {
    private static readonly STORAGE_KEY = 'comments';
    private static readonly RATED_KEY = 'ratedComments';

    static getComments(): CommentData[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    static saveComments(comments: CommentData[]): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(comments));
    }

    static getRatedComments(): Record<string, boolean> {
        const data = localStorage.getItem(this.RATED_KEY);
        return data ? JSON.parse(data) : {};
    }

    static saveRatedComments(ratedComments: Record<string, boolean>): void {
        localStorage.setItem(this.RATED_KEY, JSON.stringify(ratedComments));
    }
}
