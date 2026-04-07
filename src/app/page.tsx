import Header from "@/components/Header";
import PostForm from "@/components/PostForm";
import Feed from "@/components/Feed";

export default function Home() {
  return (
    <>
      <Header />
      <main className="max-w-[610px] mx-auto px-4 py-8 space-y-5">
        <PostForm />
        <Feed />
      </main>
    </>
  );
}
