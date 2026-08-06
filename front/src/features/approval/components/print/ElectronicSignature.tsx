import { cn } from '@/shared/lib/utils'

interface ElectronicSignatureProps {
  name: string
  variant: 'drafter' | 'reviewer'
  status: string
  className?: string
}

export function ElectronicSignature({ name, variant, status, className }: ElectronicSignatureProps) {
  const isDrafter = variant === 'drafter'
  return (
    <span
      aria-label={`${name} 전자서명`}
      className={cn(
        'relative mx-auto mt-[3px] block h-9 w-16',
        isDrafter ? 'rotate-[-5deg] text-[#2457a6]' : 'rotate-[3deg] text-[#9b2c2c]',
        className,
      )}
    >
      <svg
        viewBox="0 0 80 38"
        role="img"
        aria-hidden="true"
        className="block size-full overflow-visible"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isDrafter ? (
            <>
              <path d="M5 27 C14 8, 19 9, 14 29 C20 18, 27 8, 25 28 C31 17, 39 15, 37 28" />
              <path d="M7 31 C26 25, 46 24, 73 28" />
            </>
          ) : (
            <>
              <path d="M5 25 C12 7, 22 7, 16 27 C24 13, 31 11, 27 29 C38 8, 44 10, 40 29" />
              <path d="M42 23 C49 12, 57 13, 53 27 C60 17, 67 16, 73 23" />
              <path d="M8 31 C29 27, 51 27, 75 30" />
            </>
          )}
        </g>
      </svg>
      <span className="absolute right-[-1px] bottom-[-2px] bg-white px-[2px] text-[8px] leading-[1.2] font-bold text-current">
        {status}
      </span>
    </span>
  )
}
