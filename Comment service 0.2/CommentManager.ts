// Класс для управления комментариями
import { CommentData, SortOption, SortDirection, StorageService } from './CommentData.js';

export class CommentManager {
    private comments: CommentData[] = [];
    private ratedComments: Record<string, boolean> = {};
    private currentSortOption: SortOption = 'date';
    private currentSortDirection: SortDirection = 'desc';
    private showOnlyFavorites = false;
 
    constructor() {
        this.loadComments();
        this.loadRatedComments();
    }

    private loadComments(): void {
        this.comments = StorageService.getComments();
    }

    private loadRatedComments(): void {
        this.ratedComments = StorageService.getRatedComments();
    }

    private saveComments(): void {
        StorageService.saveComments(this.comments);
    }

    private saveRatedComments(): void {
        StorageService.saveRatedComments(this.ratedComments);
    }

    addComment(text: string, parentId: string | null = null): void {
        if (text.trim().length === 0 || text.length > 1000) return;

        const newComment: CommentData = {
            id: Date.now().toString(),
            parentId,
            author: "Максим Авдеенко",
            avatar: "./img/avatars/Mask group.png",
            text,
            date: new Date(),
            rating: 0,
            isFavorite: false,
            replies: []
        };

        if (parentId) {
            this.addReplyToComment(parentId, newComment);
        } else {
            this.comments.push(newComment);
        }

        this.saveComments();
    }
    

    private addReplyToComment(parentId: string, reply: CommentData): void {
        const parentComment = this.findCommentById(this.comments, parentId);
        if (parentComment) {
            parentComment.replies.push(reply);
        }
    }

    private findCommentById(comments: CommentData[], id: string): CommentData | null {
        for (const comment of comments) {
            if (comment.id === id) return comment;

            if (comment.replies.length > 0) {
                const foundInReplies = this.findCommentById(comment.replies, id);
                if (foundInReplies) return foundInReplies;
            }
        }
        return null;
    }

    changeRating(commentId: string, increment: boolean): void {
        if (this.ratedComments[commentId]) return;

        const comment = this.findCommentById(this.comments, commentId);
        if (comment) {
            comment.rating += increment ? 1 : -1;
            this.ratedComments[commentId] = true;
            this.saveComments();
            this.saveRatedComments();
        }
    }

    toggleFavorite(commentId: string): void {
        const comment = this.findCommentById(this.comments, commentId);
        if (comment) {
            comment.isFavorite = !comment.isFavorite;
            this.saveComments();
        }
    }

    setSortOption(option: SortOption): void {
        if (this.currentSortOption === option) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortOption = option;
            this.currentSortDirection = 'desc';
        }
    }

    toggleShowFavorites(): void {
        this.showOnlyFavorites = !this.showOnlyFavorites;
    }

    getSortedComments(): CommentData[] {
        let commentsToShow = [...this.comments];

        if (this.showOnlyFavorites) {
            commentsToShow = this.filterFavorites(commentsToShow);
        }

        return this.sortComments(commentsToShow);
    }

    private filterFavorites(comments: CommentData[]): CommentData[] {
        return comments
            .map(comment => ({
                ...comment,
                replies: this.filterFavorites(comment.replies)
            }))
            .filter(comment => comment.isFavorite || comment.replies.length > 0);
    }

    private sortComments(comments: CommentData[]): CommentData[] {
        const sortedComments = [...comments].sort((a, b) => {
            switch (this.currentSortOption) {
                case 'date':
                    return this.compareDates(a.date, b.date);
                case 'rating':
                    return a.rating - b.rating;
                case 'replies':
                    return a.replies.length - b.replies.length;
                case 'activity':
                default:
                    return this.compareDates(a.date, b.date);
            }
        });

        if (this.currentSortDirection === 'desc') {
            sortedComments.reverse();
        }

        return sortedComments.map(comment => ({
            ...comment,
            replies: this.sortComments(comment.replies)
        }));
    }

    private compareDates(a: Date, b: Date): number {
        return new Date(a).getTime() - new Date(b).getTime();
    }

    getCommentCount(): number {
        return this.countComments(this.comments);
    }

    private countComments(comments: CommentData[]): number {
        return comments.reduce((count, comment) => {
            return count + 1 + this.countComments(comment.replies);
        }, 0);
    }
}