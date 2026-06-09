import { Button } from "../ui/button"
import { Field } from "../ui/field"
import Image from "next/image"

interface OAuthButtonsProps {
  status: "connect" | "register"
}

export default function OAuthButtons({ status }: OAuthButtonsProps) {
  return (
    <Field>
      <Button variant='outline' size='lg' disabled>
        <Image
          src='/assets/google-icon.svg'
          alt='Google icon'
          width={16}
          height={16}
          data-icon='inline-start'
        />
        {status === "connect" ? <>Connect with Google</> : <>Sign up with Google</>}
      </Button>
    </Field>
  )
}
