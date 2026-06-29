import {FormControl, FormLabel} from 'react-bootstrap';
import {LuKeyRound} from 'react-icons/lu';

const calculatePasswordStrength = password => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[\W_]/.test(password)) strength++;
  return strength;
};
const PasswordInputWithStrength = ({
  password,
  setPassword,
  id,
  label,
  name,
  placeholder,
  showIcon,
  labelClassName,
  inputClassName
}) => {
  const strength = calculatePasswordStrength(password);
  const strengthBars = new Array(4).fill(0);
  return <>
      {label && <FormLabel htmlFor={id} className={labelClassName}>
          {label} <span className="text-danger">*</span>
        </FormLabel>}

      <div className="input-group">
        <FormControl type="password" name={name} id={id} placeholder={placeholder} required className={inputClassName} value={password} onChange={e => setPassword(e.target.value)} />
        {showIcon && <LuKeyRound className="app-search-icon text-muted" />}
      </div>

      <div className="password-bar my-2">
        {strengthBars.map((_, i) => <div key={i} className={'strong-bar ' + (i < strength ? `bar-active-${strength}` : '')} />)}
      </div>

      <p className="text-muted fs-xs mb-0">Use 8+ characters with letters, numbers & symbols.</p>
    </>;
};
export default PasswordInputWithStrength;