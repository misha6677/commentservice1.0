// Класс для работы с DOM
import { CommentManager } from './CommentManager.js';
import { CommentData, SortOption  } from './CommentData.js';



export class CommentRenderer {
    private commentManager: CommentManager;
    private form: HTMLFormElement;
    private textarea: HTMLTextAreaElement;
    private submitButton: HTMLButtonElement;
    private messageElement: HTMLElement;
    private commentsContainer: HTMLElement;
    private commentCountElement: HTMLElement;
    private sortOptions: NodeListOf<HTMLElement>;
    private selectedOption: HTMLElement;
    private selectWrapper: HTMLElement;
    private sortArrow: HTMLElement;
    private favoritesToggle: HTMLElement;
    private favoritesIcon: HTMLElement;

    constructor(commentManager: CommentManager) {
        this.commentManager = commentManager;

        // Получаем элементы DOM
        this.form = document.querySelector('.comment__form') as HTMLFormElement;
        this.textarea = this.form.querySelector('.comment__form-text') as HTMLTextAreaElement;
        this.submitButton = this.form.querySelector('.comment__form-button') as HTMLButtonElement;
        this.messageElement = this.form.querySelector('.comment__form-message') as HTMLElement;
        this.commentsContainer = document.getElementById('comments-container') as HTMLElement;
        this.commentCountElement = document.getElementById('comment-count') as HTMLElement;
        this.sortOptions = document.querySelectorAll('.option') as NodeListOf<HTMLElement>;
        this.selectedOption = document.querySelector('.selected-option') as HTMLElement;
        this.selectWrapper = document.querySelector('.select-wrapper') as HTMLElement;
        this.sortArrow = document.getElementById('sort-arrow') as HTMLElement;
        this.favoritesToggle = document.querySelector('.favorites-toggle') as HTMLElement;
        this.favoritesIcon = document.querySelector('.favorites-icon') as HTMLElement;

        this.initEventListeners();
        this.renderComments();
        this.updateCommentCount();
    }

    private initEventListeners(): void {
        // Форма комментария
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.textarea.addEventListener('input', () => this.handleTextareaInput());

        // Сортировка
        this.selectedOption.addEventListener('click', () => this.toggleSortDropdown());
        this.sortOptions.forEach(option => {
            option.addEventListener('click', () => this.handleSortOptionClick(option));
        });

        // Избранное
        this.favoritesToggle.addEventListener('click', () => this.toggleFavorites());

        // Закрытие выпадающего списка при клике вне его
        document.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).closest('.custom-select')) {
                this.selectWrapper.classList.remove('show');
                this.sortArrow.classList.remove('rotated');
            }
        });
    }

    private handleFormSubmit(e: Event): void {
        e.preventDefault();
        const text = this.textarea.value.trim();
        
        if (text.length > 0 && text.length <= 1000) {
            this.commentManager.addComment(text);
            this.textarea.value = '';
            this.submitButton.disabled = true;
            this.renderComments();
            this.updateCommentCount();
        }
    }

    private handleTextareaInput(): void {
        const textLength = this.textarea.value.length;
        const isTooLong = textLength > 1000;

        this.submitButton.disabled = textLength === 0 || isTooLong;
        this.messageElement.classList.toggle('show', isTooLong);
    }

    private toggleSortDropdown(): void {
        this.selectWrapper.classList.toggle('show');
        this.sortArrow.classList.toggle('rotated');
    }

    private handleSortOptionClick(option: HTMLElement): void {
        const sortOption = option.getAttribute('data-value') as SortOption;
        this.commentManager.setSortOption(sortOption);
        
        // Обновляем UI
        this.sortOptions.forEach(opt => {
            const checkmark = opt.querySelector('.checkmark') as HTMLElement;
            checkmark.style.display = 'none';
        });
        
        const checkmark = option.querySelector('.checkmark') as HTMLElement;
        checkmark.style.display = 'inline-block';
        this.selectedOption.textContent = option.textContent?.trim() || 'По дате';
        
        // Вращаем стрелку
        const currentDirection = this.commentManager['currentSortDirection'];
        this.sortArrow.style.transform = currentDirection === 'desc' ? 'rotate(0deg)' : 'rotate(180deg)';
        
        this.selectWrapper.classList.remove('show');
        this.sortArrow.classList.remove('rotated');
        
        this.renderComments();
    }

    private toggleFavorites(): void {
        this.commentManager.toggleShowFavorites();
        const isActive = this.commentManager['showOnlyFavorites'];
        
        this.favoritesIcon.setAttribute('src', isActive ? './img/heart-filled.svg' : './img/heart.svg');
        this.favoritesToggle.classList.toggle('active', isActive);
        this.renderComments();
    }

    renderComments(): void {
        const comments = this.commentManager.getSortedComments();
        this.commentsContainer.innerHTML = '';

        if (comments.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = this.commentManager['showOnlyFavorites'] 
                ? 'Нет избранных комментариев' 
                : 'Пока нет комментариев';
            emptyMessage.className = 'empty-message';
            this.commentsContainer.appendChild(emptyMessage);
            return;
        }

        comments.forEach(comment => {
            this.renderComment(comment, this.commentsContainer);
        });
    }

    private renderComment(comment: CommentData, container: HTMLElement, isReply = false): void {
        const commentElement = document.createElement('div');
        commentElement.className = `comment ${isReply ? 'comment--reply' : ''}`;
        commentElement.dataset.id = comment.id;

        const dateString = this.formatDate(comment.date);
        const isReplyTo = comment.parentId 
            ? this.findParentCommentText(comment.parentId)
            : null;

        commentElement.innerHTML = `
            <div class="comment_group">
                <div class="comment__avatar-container">
                    <img class="comment__avatar" src="${comment.avatar}" alt="Аватар">
                </div>
                <div class="comment__content">
                    <div class="comment__header">
                        <span class="comment__author">${comment.author}</span>
                        <span class="comment__date">${dateString}</span>
                    </div>
                    ${isReplyTo ? `<div class="comment__reply-to">${isReplyTo}</div>` : ''}
                    <div class="comment__text">${this.escapeHtml(comment.text)}</div>
                    <div class="comment__footer">
                          <button class="comment__reply-button">Ответить</button>
                        <div class="comment__rating">
                            <button class="comment__rating-down ${this.commentManager['ratedComments'][comment.id] ? 'disabled' : ''}">
                                <svg width="7" height="3" viewBox="0 0 7 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.0696 0.639914V2.29545H0.265625V0.639914H6.0696Z" fill="#FF0000" />
                                </svg>
                            </button>
                            <span class="comment__rating-value">${comment.rating}</span>
                            <button class="comment__rating-up ${this.commentManager['ratedComments'][comment.id] ? 'disabled' : ''}">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <path d="M4.13281 9.16903V0.526988H5.85227V9.16903H4.13281ZM0.674716 5.70455V3.98509H9.31676V5.70455H0.674716Z" fill="#8AC540" />
                             </svg>
                            </button>
                        </div>
                        <button class="comment__favorite-button ${comment.isFavorite ? 'active' : ''}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                path d="M8.00001 12.9033L3.12942 15.18C2.991 15.2533 2.828 15.2533 2.68959 15.18C2.55117 15.1067 2.46667 14.9667 2.46667 14.8133V3.33333C2.46667 2.44999 3.18334 1.73333 4.06667 1.73333H11.9333C12.8167 1.73333 13.5333 2.44999 13.5333 3.33333V14.8133C13.5333 14.9667 13.4488 15.1067 13.3104 15.18C13.2417 15.2167 13.1667 15.2333 13.0933 15.2333C13.02 15.2333 12.945 15.2167 12.8763 15.18L8.00001 12.9033Z" fill="${comment.isFavorite ? '#F36223' : '#999999'}" />
                            </svg>
                            ${comment.isFavorite ? 'В избранном' : 'В избранное'}
                        </button>
                     </div>
                </div>
            </div>
        `;

        container.appendChild(commentElement);

        // Добавляем обработчики событий
        const replyButton = commentElement.querySelector('.comment__reply-button') as HTMLElement;
        const ratingUpButton = commentElement.querySelector('.comment__rating-up') as HTMLElement;
        const ratingDownButton = commentElement.querySelector('.comment__rating-down') as HTMLElement;
        const favoriteButton = commentElement.querySelector('.comment__favorite-button') as HTMLElement;

        replyButton.addEventListener('click', () => this.handleReplyClick(comment.id));
        ratingUpButton.addEventListener('click', () => this.handleRatingChange(comment.id, true));
        ratingDownButton.addEventListener('click', () => this.handleRatingChange(comment.id, false));
        favoriteButton.addEventListener('click', () => this.handleFavoriteToggle(comment.id));

        // Рендерим ответы, если они есть
        if (comment.replies.length > 0) {
            const repliesContainer = document.createElement('div');
            repliesContainer.className = 'comment__replies';
            commentElement.appendChild(repliesContainer);

            comment.replies.forEach((reply : CommentData)=> {
                this.renderComment(reply, repliesContainer, true);
            });
        }
    }

    private findParentCommentText(parentId: string): string {
        const parentComment = this.commentManager['findCommentById'](this.commentManager['comments'], parentId);
        if (parentComment) {
            const shortText = parentComment.text.length > 30 
                ? parentComment.text.substring(0, 30) + '...' 
                : parentComment.text;
            return `Ответ на комментарий ${parentComment.author}: "${shortText}"`;
        }
        return '';
    }

    private handleReplyClick(commentId: string): void {
        const commentElement = document.querySelector(`.comment[data-id="${commentId}"]`) as HTMLElement;
        const repliesContainer = commentElement.querySelector('.comment__replies') || 
                                document.createElement('div');
        
        if (!repliesContainer.classList.contains('comment__replies')) {
            repliesContainer.className = 'comment__replies';
            commentElement.appendChild(repliesContainer);
        }

        // Проверяем, есть ли уже форма ответа
        if (repliesContainer.querySelector('.reply-form')) return;

        const replyForm = document.createElement('form');
        replyForm.className = 'reply-form';
        replyForm.innerHTML = `
            <div class="comment__form__avatar-container">
                <img class="profile-img" src="./img/avatars/Mask group.png" alt="Аватар">
            </div>
            <div class="comment__form-container">
                <div class="comment__form-header">
                    <p class="comment__form-userName">Максим Авдеенко</p>
                    <span class="comment__form-limit">Макс. 1000 символов</span>
                </div>
                <textarea class="comment__form-text" placeholder="Введите текст сообщения..." required></textarea>
                <div class="comment__form-footer">
                    <span class="comment__form-message">Слишком длинное сообщение</span>
                    <button class="comment__form-button" type="submit" disabled>Отправить</button>
                </div>
            </div>
        `;

        const textarea = replyForm.querySelector('.comment__form-text') as HTMLTextAreaElement;
        const submitButton = replyForm.querySelector('.comment__form-button') as HTMLButtonElement;
        const messageElement = replyForm.querySelector('.comment__form-message') as HTMLElement;

        textarea.addEventListener('input', () => {
            const textLength = textarea.value.length;
            const isTooLong = textLength > 1000;

            submitButton.disabled = textLength === 0 || isTooLong;
            messageElement.classList.toggle('show', isTooLong);
        });

        replyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = textarea.value.trim();
            
            if (text.length > 0 && text.length <= 1000) {
                this.commentManager.addComment(text, commentId);
                replyForm.remove();
                this.renderComments();
                this.updateCommentCount();
            }
        });

        repliesContainer.appendChild(replyForm);
        textarea.focus();
    }

    private handleRatingChange(commentId: string, increment: boolean): void {
        this.commentManager.changeRating(commentId, increment);
        this.renderComments();
    }

    private handleFavoriteToggle(commentId: string): void {
        this.commentManager.toggleFavorite(commentId);
        this.renderComments();
    }

    private updateCommentCount(): void {
        const count = this.commentManager.getCommentCount();
        this.commentCountElement.textContent = `(${count})`;
    }

    private formatDate(date: Date): string {
        const now = new Date();
        const commentDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'только что';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} ${this.pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ${this.pluralize(hours, 'час', 'часа', 'часов')} назад`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ${this.pluralize(days, 'день', 'дня', 'дней')} назад`;
        }
    }

    private pluralize(number: number, one: string, few: string, many: string): string {
        const n = Math.abs(number);
        const n10 = n % 10;
        const n100 = n % 100;

        if (n10 === 1 && n100 !== 11) {
            return one;
        }
        if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) {
            return few;
        }
        return many;
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br>");
    }
}

// Инициализация приложения

document.addEventListener('DOMContentLoaded', () => {
    const commentManager = new CommentManager();
    new CommentRenderer(commentManager);
});