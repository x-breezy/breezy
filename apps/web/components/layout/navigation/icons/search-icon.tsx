interface SearchIconProps {
  active?: boolean
  className?: string
}

export function SearchIcon({ active = false, className }: SearchIconProps) {
  if (active) {
    return (
      <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className}>
        <path
          d='M18.5 10.5C18.5 12.0823 18.0308 13.629 17.1518 14.9446C16.2727 16.2602 15.0233 17.2855 13.5615 17.891C12.0997 18.4965 10.4911 18.655 8.93928 18.3463C7.38743 18.0376 5.96197 17.2757 4.84315 16.1569C3.72433 15.038 2.9624 13.6126 2.65372 12.0607C2.34504 10.5089 2.50347 8.90034 3.10897 7.43853C3.71447 5.97672 4.73985 4.72729 6.05544 3.84824C7.37103 2.96919 8.91775 2.5 10.5 2.5C12.6217 2.5 14.6566 3.34285 16.1569 4.84315C17.6571 6.34344 18.5 8.37827 18.5 10.5Z'
          stroke='currentColor'
          strokeWidth='3'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M16.511 16.511L21.643 21.643'
          stroke='currentColor'
          strokeWidth='3'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )
  }

  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className}>
      <path
        d='M19 10.5C19 12.1811 18.5015 13.8245 17.5675 15.2223C16.6335 16.6202 15.306 17.7096 13.7528 18.353C12.1996 18.9963 10.4906 19.1647 8.84174 18.8367C7.1929 18.5087 5.67834 17.6992 4.4896 16.5104C3.30085 15.3217 2.4913 13.8071 2.16333 12.1583C1.83535 10.5094 2.00368 8.80036 2.64703 7.24719C3.29037 5.69402 4.37984 4.3665 5.77766 3.43251C7.17547 2.49852 8.81886 2 10.5 2C12.7543 2 14.9164 2.89553 16.5104 4.48959C18.1045 6.08365 19 8.24566 19 10.5Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M16.511 16.511L22 22'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
