import Image from "next/image";
import type { ReactNode } from "react";
import { Cover, type CoverCrop } from "@/components/app/Cover";

// Two-column auth screen (`.screen.auth`): form left, hero crop right with an optional quote.
// On narrow screens the image becomes a band on top and the quote is hidden.
export function AuthSplit({
  children,
  crop = "c-wide",
  quote,
}: {
  children: ReactNode;
  crop?: CoverCrop;
  quote?: { title: ReactNode; text: ReactNode };
}) {
  return (
    <div className="screen auth">
      <div className="formside">
        <div className="form" data-reveal-children>
          <div className="logo">
            <Image src="/in-it-logo.png" alt="" width={38} height={38} priority />
            IN-IT
          </div>
          {children}
        </div>
      </div>
      <div className="imgside">
        <Cover crop={crop}>
          {quote ? (
            <div className="quote" data-reveal>
              <b>{quote.title}</b>
              <span>{quote.text}</span>
            </div>
          ) : null}
        </Cover>
      </div>
    </div>
  );
}
