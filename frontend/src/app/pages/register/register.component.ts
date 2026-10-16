import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const password = group.get('password')?.value;
        const confirm = group.get('confirm')?.value;
        return password === confirm ? null : { passwordMismatch: true };
    };
}

@Component({
    selector: 'app-register',
    standalone: false,
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {

    registerForm: FormGroup;
    registerErrors: string[] = [];

    constructor(
        private fb: FormBuilder,
        private registerService: AuthService,
        private router: Router
    ) {
        this.registerForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            confirm: ['', Validators.required],
            nome: ['', Validators.required],
            cognome: ['', Validators.required]
        }, { validators: passwordMatchValidator() });
    }

    register() {
        if (this.registerForm.invalid) return;

        const newUser = this.registerForm.value;

        this.registerService.register(newUser).subscribe({
            next: (res) => {
                if (!res.success) {
                    this.registerErrors = [res.data?.message || 'Errore sconosciuto'];
                    return;
                }
                this.router.navigate(['/']);
            },
            error: (err: unknown) => {
                if (Array.isArray(err)) {
                    this.registerErrors = err.map((e: { message: string }) => e.message);
                } else if (typeof err === 'string') {
                    this.registerErrors = [err];
                } else {
                    this.registerErrors = ['Errore di connessione'];
                }
            }
        });
    }
}
