// app/blog/categories/page.tsx
import { CategoriesListPage } from '@dishistech/blogs-react';

export const metadata = {
  title: 'Categories | WhatsYour.Info Blog',
};

export default function AllCategoriesPage() {
  return (
    <>
      <h1 className="text-4xl font-extrabold text-center mb-12">
        Browse by Category
      </h1>
      <CategoriesListPage />
    </>
  );
}