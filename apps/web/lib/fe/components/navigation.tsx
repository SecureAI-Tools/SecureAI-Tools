import { tw } from "twind";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "flowbite-react";

import { FrontendRoutes } from "lib/fe/routes";
import { PUBLIC_FACING_NAME, TWIND_TEXT_COLOR } from "lib/core/constants";

interface IMenuButton {
  toggleMenu: React.MouseEventHandler<HTMLButtonElement>;
  showMenu: boolean;
}

type Link = {
  label: string;
  href: string;
};

const links: Link[] = [];

const MenuButton = ({ toggleMenu, showMenu }: IMenuButton) => (
  <button
    type="button"
    aria-controls="mobile-menu"
    aria-expanded={showMenu}
    onClick={toggleMenu}
    className={tw(`p-2 text-gray-400`)}
  >
    <span className={tw(`sr-only`)}>Open menu</span>
    {showMenu ? (
      <svg
        className={tw(`h-6 w-6`)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
        width={24}
        height={24}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ) : (
      <svg
        className={tw(`h-6 w-6`)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
        width={24}
        height={24}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    )}
  </button>
);

const MobileMenu = ({
  isLoggedIn,
  showLogIn,
}: {
  isLoggedIn: boolean;
  showLogIn?: boolean;
}) => (
  <div className={tw(`md:hidden`)}>
    <div className={tw(`px-2 pt-2 pb-3 space-y-1 sm:px-3`)}>
      {links.map((link: Link) => (
        <a
          href={link.href}
          className={tw(`text-gray-500 block px-3 py-2 text-base font-medium`)}
          key={link.label}
        >
          {link.label}
        </a>
      ))}
    </div>
    <div className={tw(`pt-4 pb-3 border-t border-gray-400`)}>
      <div className={tw(`px-2 space-y-1`)}>
        <Link
          href={FrontendRoutes.DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className={tw("ml-4")}
        >
          Discord
        </Link>
        {isLoggedIn ? (
          <a
            key="mobile-go-to-app"
            href={FrontendRoutes.APP_HOME}
            className={tw(`block px-3 py-2 text-base font-medium`)}
          >
            Go to App
          </a>
        ) : showLogIn ? (
          <Link
            key="mobile-sign-in"
            className={tw(`block px-3 py-2 text-base font-medium`)}
            href={FrontendRoutes.LOG_IN}
          >
            Log In
          </Link>
        ) : null}
      </div>
    </div>
  </div>
);

interface INavigation {
  showLogIn?: boolean;
}

const Navigation = ({ showLogIn }: INavigation) => {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const toggleMenu = () => setShowMenu(!showMenu);

  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <nav className={tw(`bg-white`)}>
      <div className={tw(`mx-auto px-4 sm:px-6 lg:px-8`)}>
        <div className={tw(`flex items-center justify-between h-24`)}>
          <div className={tw(`flex items-center`)}>
            <a href={"/"} className={tw("font-mono")}>
              <div className={tw(`flex flex-cols mt-4 mb-4 items-center`)}>
                <Image
                  className={tw(`h-16 w-16`)}
                  src="/logo.png"
                  alt="logo"
                  width={64}
                  height={64}
                />
                <p
                  className={tw(
                    `ml-4 text-3xl text-${TWIND_TEXT_COLOR} font-bold`,
                  )}
                >
                  {PUBLIC_FACING_NAME}
                </p>
              </div>
            </a>
            <div className={tw(`hidden md:block`)}>
              <div className={tw(`ml-10 flex items-baseline space-x-4`)}>
                {links.map((link: Link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={tw(
                      `text-gray-500 hover:text-gray-600 px-3 py-2 rounded-md font-medium`,
                    )}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className={tw(`hidden md:block`)}>
            <div className={tw(`ml-4 flex items-center md:ml-6`)}>
              <Link
                href={FrontendRoutes.DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className={tw("ml-4")}
              >
                Discord
              </Link>
              {isLoggedIn ? (
                <Button
                  className={tw("border-0 mr-2")}
                  target={FrontendRoutes.APP_HOME}
                >
                  Go to App
                </Button>
              ) : showLogIn ? (
                <Link href={FrontendRoutes.LOG_IN} className={tw("ml-4")}>
                  Log in
                </Link>
              ) : null}
            </div>
          </div>
          <div className={tw(`-mr-2 flex md:hidden`)}>
            <MenuButton showMenu={showMenu} toggleMenu={toggleMenu} />
          </div>
        </div>
      </div>
      {showMenu ? (
        <MobileMenu isLoggedIn={isLoggedIn} showLogIn={showLogIn} />
      ) : null}
    </nav>
  );
};

export default Navigation;
