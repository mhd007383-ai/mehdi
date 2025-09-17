export interface BackgroundImage {
    id: string;
    name: string;
    thumbnailUrl: string;
    fullUrl: string;
}

export const backgroundImages: BackgroundImage[] = [
    {
        id: 'default',
        name: 'ساده',
        thumbnailUrl: 'https://placehold.co/200x150/e2e8f0/4a5568?text=%D8%B3%D8%A7%D8%AF%D9%87',
        fullUrl: '',
    },
    {
        id: 'isfahan',
        name: 'میدان نقش جهان',
        thumbnailUrl: 'https://images.unsplash.com/photo-1595151528439-443e48542289?w=200&h=150&fit=crop',
        fullUrl: 'https://images.unsplash.com/photo-1595151528439-443e48542289?q=80&w=1920',
    },
    {
        id: 'persepolis',
        name: 'تخت جمشید',
        thumbnailUrl: 'https://images.unsplash.com/photo-1631181263998-f2a87570b586?w=200&h=150&fit=crop',
        fullUrl: 'https://images.unsplash.com/photo-1631181263998-f2a87570b586?q=80&w=1920',
    },
    {
        id: 'yazd',
        name: 'شهر یزد',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542895514-f633a152335d?w=200&h=150&fit=crop',
        fullUrl: 'https://images.unsplash.com/photo-1542895514-f633a152335d?q=80&w=1920',
    },
     {
        id: 'garden',
        name: 'باغ ایرانی',
        thumbnailUrl: 'https://images.unsplash.com/photo-1558255243-81f1a533aa83?w=200&h=150&fit=crop',
        fullUrl: 'https://images.unsplash.com/photo-1558255243-81f1a533aa83?q=80&w=1920',
    },
    {
        id: 'damavand',
        name: 'کوه دماوند',
        thumbnailUrl: 'https://images.unsplash.com/photo-1627892911129-b635f795275e?w=200&h=150&fit=crop',
        fullUrl: 'https://images.unsplash.com/photo-1627892911129-b635f795275e?q=80&w=1920',
    }
];
