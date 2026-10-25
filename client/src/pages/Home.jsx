import React from "react";
import {
  MainBanner,
  Categories,
  BestSeller,
  BottomBanner,
  NewsLetter
} from "../components";

export default function Home() {
  return (
    <div className="mt-10">
      <MainBanner />
      <Categories />
      <BestSeller />
      <BottomBanner />
      <NewsLetter />
    </div>
  );
}
