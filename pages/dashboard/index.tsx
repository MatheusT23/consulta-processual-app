import { AppSidebar } from "@/components/app-sidebar"
import Head from "next/head"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { BottomNav } from "@/components/bottom-nav"

export default function DashboardPage() {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div
            className="flex flex-col safe-h-screen bg-[#fff] text-blue font-sans font-medium"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
              {Array.from({ length: 24 }).map((_, index) => (
                <div key={index} className="bg-muted/50 aspect-video h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </SidebarInset>
        <BottomNav />
      </SidebarProvider>
    </>
  )
}

