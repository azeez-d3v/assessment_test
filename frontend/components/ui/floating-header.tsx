'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, MenuIcon, GithubIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const GITHUB_REPO_URL = 'https://github.com/azeez-d3v/assessment_test'

export function FloatingHeader() {
    const [open, setOpen] = React.useState(false)

    const links = [
        {
            label: 'Chat',
            href: '/',
        },
        {
            label: 'Documents',
            href: '/docs',
        },
    ]

    return (
        <header
            className={cn(
                'sticky top-4 z-50',
                'mx-auto w-full max-w-3xl rounded-lg border border-bg-300 shadow-sm',
                'bg-bg-0/95 supports-[backdrop-filter]:bg-bg-0/80 backdrop-blur-lg',
            )}
        >
            <nav className="mx-auto flex items-center justify-between p-2">
                {/* Logo */}
                <Link
                    href="/"
                    className="hover:bg-bg-200 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 duration-100"
                >
                    <FileText className="size-5 text-text-200" />
                    <span className="font-bold text-base text-text-100">DocuQ&A</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-1 md:flex">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            className="px-3 py-1.5 text-sm font-medium text-text-300 transition-colors hover:text-text-100"
                            href={link.href}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    {/* GitHub Button */}
                    <Button size="sm" asChild>
                        <a
                            href={GITHUB_REPO_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gap-2"
                        >
                            <GithubIcon className="size-4" />
                            <span className="hidden sm:inline">GitHub</span>
                        </a>
                    </Button>

                    {/* Mobile Menu */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => setOpen(!open)}
                            className="md:hidden"
                        >
                            <MenuIcon className="size-4" />
                        </Button>
                        <SheetContent
                            className="bg-bg-0/95 supports-[backdrop-filter]:bg-bg-0/80 gap-0 backdrop-blur-lg"
                            showClose={false}
                            side="left"
                        >
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navigation Menu</SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-y-2 overflow-y-auto px-4 pt-12 pb-5">
                                {links.map((link) => (
                                    <Link
                                        key={link.label}
                                        className={buttonVariants({
                                            variant: 'ghost',
                                            className: 'justify-start hover:text-white',
                                        })}
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </header>
    )
}
