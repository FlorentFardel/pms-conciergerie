/**
 * @file detail.ts
 * @module Features/Properties/Components/PropertyDetail
 * @description Composant de consultation détaillée d'une propriété et de ses logements rattachés.
 * Écoute de façon réactive les paramètres d'URL ou l'Input @Input() propertyId pour exécuter les requêtes HTTP BDD.
 */

import { Component, OnInit, OnDestroy, Input, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subscription } from 'rxjs';
import { UnitsListComponent } from './../../../units/components/units-list/list';
import { UiButtonComponent } from '../../../../shared/components/ui-button/modal';

/**
 * Modèle de données représentatif d'une propriété stockée en base de données PostgreSQL.
 */
export interface PropertyDetail {
  /** Identifiant unique UUID de la propriété */
  id: string;
  /** Nom de la propriété / bâtiment */
  name: string;
  /** Adresse postale (optionnel) */
  address?: string;
  /** Code postal (optionnel) */
  postal_code?: string;
  /** Ville (optionnel) */
  city?: string;
}

/**
 * Composant conteneur affichant les détails d'une propriété et sa liste de logements.
 * Accepte l'identifiant par route active ou par liaison directe via @Input() propertyId.
 */
@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, UnitsListComponent, UiButtonComponent],
  templateUrl: './detail.html',
  styleUrl: './detail.scss'
})
export class PropertyDetailComponent implements OnInit, OnDestroy {
  /** Service d'accès aux données de la route active Angular */
  private readonly route = inject(ActivatedRoute);

  /** Client HTTP pour exécuter les appels vers l'API backend Express/PostgreSQL */
  private readonly http = inject(HttpClient);

  /** Service de gestion de l'historique de navigation du navigateur */
  private readonly location = inject(Location);

  /** Point d'entrée de l'API backend pour le domaine des propriétés */
  private readonly apiUrl = '/api/properties';

  /** Référence vers l'abonnement RxJS aux changements de paramètres d'URL */
  private paramSub?: Subscription;

  /** Stockage interne de l'identifiant de propriété reçu via @Input */
  private _propertyId?: string;

  /**
   * Identifiant unique de la propriété transmis directement par le composant parent.
   * Déclenche automatiquement le chargement BDD lorsque la valeur change.
   * 
   * @type {string | undefined}
   */
  @Input()
  set propertyId(value: string | undefined) {
    this._propertyId = value;
    if (value) {
      this.fetchPropertyDetail(value);
    }
  }
  get propertyId(): string | undefined {
    return this._propertyId;
  }

  /** 
   * Signal d'état contenant l'objet propriété chargé depuis la BDD (`null` si non chargé).
   * @type {WritableSignal<PropertyDetail | null>}
   */
  readonly property = signal<PropertyDetail | null>(null);

  /** 
   * Signal d'état indiquant si une requête HTTP est en cours d'exécution.
   * @type {WritableSignal<boolean>}
   */
  readonly loading = signal<boolean>(true);

  /** 
   * Signal d'état conservant le message d'erreur d'exécution ou de réseau (`null` si aucune erreur).
   * @type {WritableSignal<string | null>}
   */
  readonly error = signal<string | null>(null);

  /**
   * Cycle de vie Angular : Initialisation du composant.
   * S'abonne aux changements de paramètres d'URL si l'ID n'a pas été transmis via @Input.
   * 
   * @returns {void}
   */
  ngOnInit(): void {
    // Si propertyId est déjà fourni par l'Input parent, inutile de lire la route
    if (this.propertyId) {
      return;
    }

    this.paramSub = this.route.paramMap.subscribe((params) => {
      const routeId = 
        params.get('id') || 
        params.get('propertyId') || 
        params.get('property_id');

      if (!routeId) {
        if (!this.propertyId) {
          this.error.set('Propriété introuvable (identifiant manquant).');
          this.loading.set(false);
        }
        return;
      }

      this.fetchPropertyDetail(routeId);
    });
  }

  /**
   * Cycle de vie Angular : Nettoyage du composant.
   * Résilie la souscription RxJS pour prévenir toute fuite mémoire.
   * 
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }

  /**
   * Exécute la requête HTTP GET vers l'API backend pour charger la propriété par son UUID.
   * 
   * @param {string} id Identifiant unique UUID de la propriété
   * @private
   * @returns {Promise<void>}
   */
  private async fetchPropertyDetail(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await firstValueFrom(
        this.http.get<PropertyDetail>(`${this.apiUrl}/${id}`)
      );

      if (!data) {
        this.error.set('Propriété introuvable en base de données.');
        return;
      }

      this.property.set(data);
    } catch (err: unknown) {
      console.error('[PropertyDetailComponent] Erreur chargement BDD :', err);
      this.error.set('Propriété introuvable ou erreur réseau.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Déclenche la navigation de retour vers la vue précédente dans l'historique du navigateur.
   * 
   * @returns {void}
   */
  goBack(): void {
    this.location.back();
  }
}