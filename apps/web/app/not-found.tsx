export default function NotFound() {
  return (
    <div className='flex flex-col items-center justify-center px-4 py-24 text-center'>
      <p className='text-lg font-medium text-foreground'>Sorry, this page isn&apos;t available.</p>
      <p className='mt-2 text-sm text-muted-foreground'>
        The link you followed may be broken, or the page may have been removed.{" "}
        <a href='/' className='font-medium text-foreground hover:underline'>
          Go back to Breezy.
        </a>
      </p>
    </div>
  )
}
